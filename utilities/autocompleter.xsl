<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<!--
	Example usage that overrides item generation to add image to entries from "photos" section:

		<xsl:include href="../utilities/autocompleter.xsl"/>

		<xsl:template match="entry[../section/@handle = 'photos']" mode="autocompleter-item-meta">
			<img>
				<xsl:attribute name="src">
					<xsl:value-of select="concat(/data/params/root, '/format/thumbnail', path)"/>
				</xsl:attribute>
			</img>
			<span class="section"><xsl:value-of select="../section"/></span>
		</xsl:template>

		<xsl:template match="/">
			<xsl:apply-templates select="." mode="autocompleter"/>
		</xsl:template>
-->


<!--
	Set value of autocompleterMode parameter.
-->
<xsl:param name="autocompleterMode">
	<xsl:choose>
		<xsl:when test="/data/params/url-qmode = 'embed' or /data/params/url-qmode = 'link'">
			<xsl:value-of select="$url-qmode"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:text>raw</xsl:text>
		</xsl:otherwise>
	</xsl:choose>
</xsl:param>


<!--
	Set value of autocompleterPrefix parameter.
-->
<xsl:param name="autocompleterPrefix">
	<xsl:choose>
		<xsl:when test="$autocompleterMode = 'embed'">
			<xsl:text>[</xsl:text>
		</xsl:when>
		<xsl:when test="$autocompleterMode = 'link'">
			<xsl:text>(</xsl:text>
		</xsl:when>
	</xsl:choose>

	<xsl:choose>
		<xsl:when test="/data/params/url-qlocal = 'yes'">
			<xsl:text>./</xsl:text>
		</xsl:when>
		<xsl:otherwise>
			<xsl:text>/</xsl:text>
		</xsl:otherwise>
	</xsl:choose>
</xsl:param>


<!--
	Set value of autocompleterPostfix parameter.
-->
<xsl:param name="autocompleterPostfix">
	<xsl:choose>
		<xsl:when test="$autocompleterMode = 'embed'">
			<xsl:text>]</xsl:text>
		</xsl:when>
		<xsl:when test="$autocompleterMode = 'link'">
			<xsl:text>)</xsl:text>
		</xsl:when>
	</xsl:choose>
</xsl:param>


<!--
	Default template for item prefix.
	It assumes that SubsectionManager field handle will be the same as its target section handle.
-->
<xsl:template match="entry" mode="autocompleter-item-prefix" priority="0">
	<xsl:choose>
		<xsl:when test="/data/params/url-qlocal = 'yes'">
			<xsl:value-of select="concat($autocompleterPrefix, ../section/@handle, '/')"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="concat($autocompleterPrefix, ../section/@handle, '/')"/>
			<xsl:value-of select="/data/params/url-qfield"/>
			<xsl:text>/</xsl:text>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>


<!--
	Default template for item postfix.
	It assumes that SubsectionManager field handle will be the same as its target section handle.
-->
<xsl:template match="entry" mode="autocompleter-item-postfix" priority="0">
	<xsl:choose>
		<xsl:when test="$autocompleterMode = 'embed'">
			<xsl:text>]</xsl:text>
		</xsl:when>
		<xsl:when test="$autocompleterMode = 'link'">
			<xsl:text>)</xsl:text>
		</xsl:when>
	</xsl:choose>
</xsl:template>


<!--
	Default template for section class.
-->
<xsl:template match="section" mode="autocompleter-item-class" priority="0">
	
</xsl:template>

<!--
	Default template for field class.
-->
<xsl:template match="field" mode="autocompleter-item-class" priority="0">
	
</xsl:template>

<!--
	Default template for item class.
-->
<xsl:template match="entry" mode="autocompleter-item-class" priority="0">
	
</xsl:template>


<!--
	Default template for section value.
-->
<xsl:template match="section" mode="autocompleter-item-value" priority="0">
	<xsl:value-of select="@id" />
</xsl:template>

<!--
	Default template for field value.
-->
<xsl:template match="field" mode="autocompleter-item-value" priority="0">
	<xsl:value-of select="@id" />
</xsl:template>

<!--
	Default template for item value.
-->
<xsl:template match="entry" mode="autocompleter-item-value" priority="0">
	<xsl:value-of select="@id" />
</xsl:template>


<!--
	Default template for section preview.
-->
<xsl:template match="section" mode="autocompleter-item-preview" priority="0">
	<xsl:value-of select="concat($autocompleterPrefix, @handle, '/')"/>
</xsl:template>

<!--
	Default template for field preview.
-->
<xsl:template match="field" mode="autocompleter-item-preview" priority="0">
	<xsl:variable name="section">
		<xsl:choose>
			<xsl:when test="/data/params/url-qlocal = 'yes'">
				<xsl:text></xsl:text>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat(../@handle, '/')"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>

	<xsl:value-of select="concat($autocompleterPrefix, $section, @handle, '/')"/>
</xsl:template>

<!--
	Default template for item preview.
-->
<xsl:template match="entry" mode="autocompleter-item-preview" priority="0">
	<xsl:apply-templates select="." mode="autocompleter-item-prefix"/>
	<xsl:value-of select="title|name|path|type"/>
	<xsl:apply-templates select="." mode="autocompleter-item-postfix"/>
</xsl:template>


<!--
	Default template for section drop content.
	Same as preview.
-->
<xsl:template match="section" mode="autocompleter-item-drop" priority="0">
	<xsl:apply-templates select="." mode="autocompleter-item-preview"/>
</xsl:template>

<!--
	Default template for field drop content.
	Same as preview.
-->
<xsl:template match="field" mode="autocompleter-item-drop" priority="0">
	<xsl:apply-templates select="." mode="autocompleter-item-preview"/>
</xsl:template>

<!--
	Default template for item drop content.
	In embed mode output looks like this: [photos://123].
	In link mode output looks like this: "Great wall photo" (photos://123).
	In raw mode output looks like this: photos://123.
-->
<xsl:template match="entry" mode="autocompleter-item-drop" priority="0">
	<xsl:choose>
		<xsl:when test="$autocompleterMode = 'embed'">
			<xsl:value-of select="concat('[', ../section/@handle, '://', @id, ']')"/>
		</xsl:when>
		<xsl:when test="$autocompleterMode = 'link'">
			<xsl:value-of select="concat('&quot;', title|name|path|type, '&quot; (', ../section/@handle, '://', @id, ')')"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="concat(../section/@handle, '://', @id)"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>


<!--
	Default template for item select-in field names.
	It assumes that SubsectionManager field handle is the same as its target section handle.
-->
<xsl:template match="entry" mode="autocompleter-item-select-fields" priority="0">
	<xsl:value-of select="../section/@handle"/>
</xsl:template>


<!--
	Default template for section meta content.
-->
<xsl:template match="section" mode="autocompleter-item-meta" priority="0">
	<span class="type">Section</span>
</xsl:template>

<!--
	Default template for field meta content.
-->
<xsl:template match="field" mode="autocompleter-item-meta" priority="0">
	<span class="type">Field</span>
	<span class="section"><xsl:value-of select="../name"/></span>
</xsl:template>

<!--
	Default template for item meta content.
	It outputs entry/date, entry/type and parent section.
-->
<xsl:template match="entry" mode="autocompleter-item-meta" priority="0">
	<xsl:if test="date">
		<span class="date"><xsl:value-of select="date"/></span>
	</xsl:if>
	<xsl:if test="type">
		<span class="type"><xsl:value-of select="type"/></span>
	</xsl:if>
	<span class="section"><xsl:value-of select="../section"/></span>
</xsl:template>


<!--
	Default template for section text value.
-->
<xsl:template match="section" mode="autocompleter-item-text" priority="0">
	<xsl:value-of select="name"/>
</xsl:template>

<!--
	Default template for field text value.
-->
<xsl:template match="field" mode="autocompleter-item-text" priority="0">
	<xsl:value-of select="."/>
</xsl:template>

<!--
	Default template for item text value.
	It outputs entry/title or entry/name or entry/path.
-->
<xsl:template match="entry" mode="autocompleter-item-text" priority="0">
	<xsl:value-of select="title|name|path"/>
</xsl:template>


<!--
	Build LI element for each section.
-->
<xsl:template match="section" mode="autocompleter-item" priority="0">
	<li>
		<xsl:attribute name="class">
			<xsl:value-of select="concat('item continue section ', @handle)"/>
			<xsl:apply-templates select="." mode="autocompleter-item-class"/>
		</xsl:attribute>
		<xsl:attribute name="data-value">
			<xsl:apply-templates select="." mode="autocompleter-item-value"/>
		</xsl:attribute>
		<xsl:attribute name="data-preview">
			<xsl:apply-templates select="." mode="autocompleter-item-preview"/>
		</xsl:attribute>
		<xsl:attribute name="data-drop">
			<xsl:apply-templates select="." mode="autocompleter-item-drop"/>
		</xsl:attribute>
		<div class="meta">
			<xsl:apply-templates select="." mode="autocompleter-item-meta"/>
		</div>
		<xsl:apply-templates select="." mode="autocompleter-item-text"/>
	</li>
</xsl:template>

<!--
	Build LI element for each section/field.
-->
<xsl:template match="section/field" mode="autocompleter-item" priority="0">
	<li>
		<xsl:attribute name="class">
			<xsl:value-of select="concat('item continue field ', @handle)"/>
		</xsl:attribute>
		<xsl:attribute name="data-value">
			<xsl:apply-templates select="." mode="autocompleter-item-value"/>
		</xsl:attribute>
		<xsl:attribute name="data-preview">
			<xsl:apply-templates select="." mode="autocompleter-item-preview"/>
		</xsl:attribute>
		<xsl:attribute name="data-drop">
			<xsl:apply-templates select="." mode="autocompleter-item-drop"/>
		</xsl:attribute>
		<div class="meta">
			<xsl:apply-templates select="." mode="autocompleter-item-meta"/>
		</div>
		<xsl:apply-templates select="." mode="autocompleter-item-text"/>
	</li>
</xsl:template>

<!--
	Build LI element for each entry.
-->
<xsl:template match="entry" mode="autocompleter-item" priority="0">
	<li>
		<xsl:attribute name="class">
			<xsl:value-of select="concat('item ', ../section/@handle)"/>
			<xsl:apply-templates select="." mode="autocompleter-item-class"/>
		</xsl:attribute>
		<xsl:attribute name="data-value">
			<xsl:apply-templates select="." mode="autocompleter-item-value"/>
		</xsl:attribute>
		<xsl:attribute name="data-preview">
			<xsl:apply-templates select="." mode="autocompleter-item-preview"/>
		</xsl:attribute>
		<xsl:attribute name="data-drop">
			<xsl:apply-templates select="." mode="autocompleter-item-drop"/>
		</xsl:attribute>
		<xsl:attribute name="data-select-in">
			<xsl:apply-templates select="." mode="autocompleter-item-select-fields"/>
		</xsl:attribute>
		<div class="meta">
			<xsl:apply-templates select="." mode="autocompleter-item-meta"/>
		</div>
		<xsl:apply-templates select="." mode="autocompleter-item-text"/>
	</li>
</xsl:template>


<!--
	Build section item.
	Ignore hidden sections.
-->
<xsl:template match="section" mode="autocompleter-section" priority="0">
	<xsl:if test="@hidden = 'no'">
		<xsl:apply-templates select="." mode="autocompleter-item"/>
	</xsl:if>
</xsl:template>

<!--
	Build field item.
	Ignore hidden fields.
-->
<xsl:template match="section/field" mode="autocompleter-field" priority="0">
	<xsl:if test="@show_column='yes' or @hide='no'">
		<xsl:apply-templates select="." mode="autocompleter-item"/>
	</xsl:if>
</xsl:template>

<!--
	Build entry item.
	Just pass through. This template is mainly for easy overrides.
-->
<xsl:template match="entry" mode="autocompleter-entry" priority="0">
	<xsl:apply-templates select="." mode="autocompleter-item"/>
</xsl:template>


<!--
	Build section items.
-->
<xsl:template match="/" mode="autocompleter-sections" priority="0">
	<xsl:if test="/data/params/url-qhas = 'section'">
		<xsl:apply-templates select="data/autocomplete-sections/section" mode="autocompleter-section">
			<xsl:sort select="@proximity" data-type="number" order="ascending"/>
		</xsl:apply-templates>
	</xsl:if>
</xsl:template>

<!--
	Build field items.
-->
<xsl:template match="/" mode="autocompleter-fields" priority="0">
	<xsl:if test="/data/params/url-qhas = 'field'">
		<xsl:apply-templates select="data/autocomplete-sections/section/field" mode="autocompleter-field">
			<xsl:sort select="@proximity" data-type="number" order="ascending"/>
		</xsl:apply-templates>
	</xsl:if>
</xsl:template>

<!--
	Build entry items.
-->
<xsl:template match="/" mode="autocompleter-entries" priority="0">
	<xsl:for-each select="data/*[starts-with(local-name(),'autocomplete') and count(entry) &gt; 0 and count(section) &gt; 0]">
		<xsl:apply-templates select="entry" mode="autocompleter-entry"/>
	</xsl:for-each>
</xsl:template>


<!--
	Select data from sources that have names starting with 'autocomplete'.
	Build UL element for each data source that returned entries.
-->
<xsl:template match="/" mode="autocompleter">
	<xsl:apply-templates select="." mode="autocompleter-sections"/>
	<xsl:apply-templates select="." mode="autocompleter-fields"/>
	<xsl:apply-templates select="." mode="autocompleter-entries"/>
</xsl:template>


</xsl:stylesheet>
